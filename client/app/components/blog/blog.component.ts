import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { UserService } from '../../services/user.service';
import { BlogService } from '../../services/blog.service';
import { FlashService, FlashType } from '../../services/flash.service';
import * as marked from 'marked';
import * as moment from 'moment';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styles: []
})
export class BlogComponent implements OnInit {

  // The ID of the user viewing this blog, if logged in.
  private userId: string = '';

  // Fetching Flags
  private blogFetching: boolean = false;
  private commentsFetching: boolean = false;

  // Blog Details
  private blog: any = null;
  private blogBodyParsed: SafeHtml = null;
  private blogAuthorSubbed: boolean = false;
  private blogId: string = '';
  private blogError: string = '';

  // Blog Comments
  private comments: any[] = [];
  private commentsPage: number = 0;
  private commentsLastPage: boolean = true;
  private commentsError: string = '';
  private commentInput: string = '';

  // Fetches the blog.
  fetchBlog () {
    this.blog = null;
    this.comments = [];
    this.blogBodyParsed = null;
    this.blogAuthorSubbed = false;
    this.blogError = '';
    this.blogFetching = true;

    this.blogService.viewBlog(this.blogId).subscribe(
      response => {
        const blog = response.json();
        const token = this.loginService.getToken();
        
        if (token) {
          this.userId = token.id;
          this.userService.isUserSubscribed(token.id, blog.authorId).subscribe(
            response => { this.blogAuthorSubbed = response.json().subscribed; },
            () => { this.blogAuthorSubbed = false; }
          )
        }

        blog.postDate = moment(blog.postDate).format('MMMM Do, YYYY');
        this.blogBodyParsed = this.domSanitizer.bypassSecurityTrustHtml(marked(blog.body, { sanitize: true }));
        this.blog = blog;
        this.blogFetching = false;
      },

      error => {
        const { message } = error.json().error;

        this.blogError = message;
        this.blogFetching = false;
      }
    );
  }

  fetchBlogComments (page: number = 0) {
    this.commentsError = '';
    this.commentsFetching = true;
    this.commentsPage = page;

    this.blogService.viewBlogComments(this.blogId, this.commentsPage).subscribe(
      response => {
        const { comments, lastPage } = response.json();

        if (comments.length === 0 && this.commentsPage > 0) {
          this.fetchBlogComments(this.commentsPage - 1);
          return;
        }

        for (let i = 0; i < comments.length; ++i) {
          comments[i].postDate = moment(comments[i].postDate).format('MMMM Do YYYY, h:mm:ss a');
        }

        this.comments = comments;
        this.commentsLastPage = lastPage;
        this.commentsFetching = false;
      },

      error => {
        const { message } = error.json().error;

        this.commentsError = message;
        this.commentsFetching = false;
      }
    );
  }

  constructor(
    private domSanitizer: DomSanitizer,
    private activatedRoute: ActivatedRoute,
    private routerService: Router,
    private loginService: LoginService,
    private userService: UserService,
    private blogService: BlogService,
    private flashService: FlashService
  ) { }

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.blogId = params['blogId'];
      this.fetchBlog();
      this.fetchBlogComments();
    });
  }

  onCommentsPreviousClicked () {
    if (this.commentsPage > 0) { this.fetchBlogComments(this.commentsPage - 1); }
  }

  onCommentsNextClicked () {
    if (this.commentsLastPage === false) { this.fetchBlogComments(this.commentsPage + 1); }
  }

  onRatingClicked (score: number) {
    this.blogService.rateBlog(this.blogId, score).subscribe(
      response => {
        const { message } = response.json();

        this.flashService.deploy(message, [], FlashType.OK);
        this.fetchBlog();
      },

      error => {
        const { status, message } = error.json().error;

        if (status === 401) {
          this.routerService.navigate([ '/user/login' ], { queryParams: { returnUrl: `/blog/view/${this.blogId}` }});
        } else {
          this.flashService.deploy(message, [], FlashType.Error);
        }
      }
    );
  }

  onCommentSubmit (ev) {
    ev.preventDefault();

    this.blogService.commentOnBlog(this.blogId, this.commentInput).subscribe(
      response => {
        const { message } = response.json();

        this.flashService.deploy(message, [], FlashType.OK);
        this.fetchBlogComments(0);
        this.commentInput = '';
        this.blog.commentCount++;
      },

      error => {
        const { status, message } = error.json().error;

        if (status === 401) {
          this.routerService.navigate([ '/user/login' ], { queryParams: { returnUrl: `/blog/view/${this.blogId}` }});
        } else {
          this.flashService.deploy(message, [], FlashType.Error);
        }
      }
    );
  }

  onDeleteCommentClicked (ev, id) {
    ev.stopPropagation();
    this.blogService.deleteComment(this.blogId, id).subscribe(
      response => {
        const { message } = response.json();
        
        this.flashService.deploy(message, [], FlashType.OK);
        this.fetchBlogComments(this.commentsPage);
        this.blog.commentCount--;
      },
      
      error => {
        const { status, message } = error.json().error;

        if (status === 401) {
          this.routerService.navigate([ '/user/login' ], { queryParams: { returnUrl: `/blog/view/${this.blogId}` }});
        } else {
          this.flashService.deploy(message, [], FlashType.Error);
        }
      }
    );
  }

  onEditBlogClicked () {
    this.routerService.navigate([ '/blog/editor' ], {
      queryParams: {
        mode: 'edit',
        blogId: this.blogId
      }
    });
  }

  onDeleteBlogClicked () {
    const ays = confirm(
      'This wil delete your blog. Are you sure?'
    );

    if (ays === true) {
      this.blogService.deleteBlog(this.blogId).subscribe(
        response => {
          const { message } = response.json();
          
          this.flashService.deploy(message, [], FlashType.OK);
          this.routerService.navigate([ '/' ], { replaceUrl: true });
        },
        
        error => {
          const { status, message } = error.json().error;
  
          if (status === 401) {
            this.routerService.navigate([ '/user/login' ], { queryParams: { returnUrl: `/blog/view/${this.blogId}` }});
          } else {
            this.flashService.deploy(message, [], FlashType.Error);
          }
        }
      )
    }
  }

  toggleSubscribe (ev) {
    ev.preventDefault();
    const token = this.loginService.getToken();

    if (token) {
      this.userService.isUserSubscribed(token.id, this.blog.authorId).subscribe(
        response => { 
          const isSubscribed = response.json().subscribed; 
          this.blogAuthorSubbed = isSubscribed;

          if (isSubscribed) {
            this.userService.unsubscribeFromUser(this.blog.authorId).subscribe(
              response => {
                const { message } = response.json();

                this.flashService.deploy(message, [], FlashType.OK);
                this.blogAuthorSubbed = false;
              },
              error => {
                const { message } = error.json().error;

                this.flashService.deploy(message, [], FlashType.Error);
              }
            );
          } else {
            this.userService.subscribeToUser(this.blog.authorId).subscribe(
              response => {
                const { message } = response.json();

                this.flashService.deploy(message, [], FlashType.OK);
                this.blogAuthorSubbed = true;
              },
              error => {
                const { message } = error.json().error;

                this.flashService.deploy(message, [], FlashType.Error);
              }
            );
          }
        },
        error => { 
          const { message } = error.json().error;

          this.flashService.deploy(message, [], FlashType.Error);
          this.blogAuthorSubbed = false; 
        }
      );
    } else {
      this.routerService.navigate([ '/user/login' ], { queryParams: { returnUrl: `/blog/view/${this.blogId}` }});
    }
  }

}
