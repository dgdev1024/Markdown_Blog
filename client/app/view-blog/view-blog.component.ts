import { Component, OnInit } from '@angular/core';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { BlogService } from '../blog.service';
import { AuthService } from '../auth.service'
import { FlashService, FlashType } from '../flash.service';
import * as moment from 'moment';
import * as marked from 'marked';

@Component({
  selector: 'app-view-blog',
  templateUrl: 'view-blog.component.html',
  styles: []
})
export class ViewBlogComponent implements OnInit {

  // Fetch our user ID.
  private userId: string = '';

  // Fetching Status
  private fetchingBlog: boolean = true;
  private fetchingComments: boolean = true;

  // The ID of the blog being fetched.
  private blogId: string = '';

  // Store our fetched blog and comments here.
  private fetchedBlog: any = null;
  private fetchedComments: any[] = [];

  // Store the markedown-parsed body of the blog here.
  private parsedMarkdown: SafeHtml = null;

  // Store some details about our fetched comments here.
  private commentPage: number = 0;
  private commentLastPage: boolean = true;

  // Store any error that occurs while fetching our blogs or comments.
  private blogError: string = '';
  private commentError: string = '';

  // Store the user's comment here.
  private postComment: string = '';

  private fetchBlogComments (page: number = 0) {
    // Reset our comment fetching and error states.
    this.fetchedComments = [];
    this.fetchingComments = true;
    this.commentError = '';

    // Set up our comment page.
    this.commentPage = page;

    // Fetch the comments from our database.
    this.blog.viewBlogComments(this.blogId, this.commentPage).subscribe(
      response => {
        let { comments, lastPage } = response.json();
        for (let i = 0; i < comments.length; ++i) {
          comments[i].postDate = moment(comments[i].postDate).format('MMMM Do, YYYY [at] h:mm:ss a')
        }

        this.fetchedComments = comments;
        this.commentLastPage = lastPage;
        this.fetchingComments = false;
      },

      error => {
        const { message } = error.json().error;
        this.commentError = message;
        this.fetchingComments = false;
      }
    );
  }

  private fetchBlog () {
    // Clear out our other blog and comments.
    this.fetchedBlog = null;
    this.parsedMarkdown = null;
    this.fetchedComments = [];

    // Reset our blog fetching state and error string.
    this.fetchingBlog = true;
    this.blogError = '';

    // Also set our comment page to zero.
    this.commentPage = 0;

    // Get the ID of the blog to be fetched from the route parameters.
    this.route.params.subscribe(params => {
      this.blogId = params['blogId'];

      // Fetch the blog from the database.
      this.blog.viewBlog(this.blogId).subscribe(
        response => {
          // Store the blog data.
          this.fetchedBlog = response.json();

          // Format the blog's data.
          this.fetchedBlog.postDate = moment(this.fetchedBlog.postDate).format('MMMM Do, YYYY');

          // Parse the blog's body and store it.
          this.parsedMarkdown = this.sanitizer.bypassSecurityTrustHtml(
            marked(this.fetchedBlog.body, { sanitize: true })
          );

          // Not fetching blogs anymore.
          this.fetchingBlog = false;

          // Fetch comments.
          this.fetchBlogComments(this.commentPage);
        },

        error => {
          // Fetch the error and store it.
          const { message } = error.json().error;
          this.blogError = message;
          
          // Not fetching anymore.
          this.fetchingBlog = false;
        }
      );
    });
  }

  constructor(
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private blog: BlogService,
    private flash: FlashService
  ) { }

  ngOnInit() {
    const token = this.auth.getToken();
    if (token && token.id) {
      this.userId = token.id;
    }
    this.fetchBlog();
  }

  onRatingSubmitted (score) {
    this.blog.rateBlog(this.blogId, score).subscribe(
      response => {
        const { message } = response.json();
        this.flash.deploy(message, [], FlashType.OK);
        this.fetchBlog();
      },

      error => {
        const { message, status } = error.json().error;
        
        if (status === 401) {
          this.router.navigate([ '/user/login' ], { queryParams: { returnUrl: `/blog/view/${this.blogId}`}});
        } else {
          this.flash.deploy(message, [], FlashType.Error);
        }
      }
    );
  }

  onCommentSubmit (ev) {
    ev.preventDefault();

    this.blog.commentOnBlog(this.blogId, this.postComment).subscribe(
      response => {
        const { message } = response.json();
        this.flash.deploy(message, [], FlashType.OK);
        this.postComment = '';
        this.fetchBlogComments(0);
      },

      error => {
        const { message, status } = error.json().error;

        if (status === 401) {
          this.router.navigate([ '/user/login' ], { queryParams: { returnUrl: `/blog/view/${this.blogId}`}});
        } else {
          this.flash.deploy(message, [], FlashType.Error);
        }
      }
    );
  }

  onDeleteCommentClicked (id) {
    this.blog.deleteComment(this.blogId, id).subscribe(
      response => {
        this.fetchBlogComments(this.commentPage);
      },

      error => {
        const { message, status } = error.json().error;
        this.flash.deploy(message, [], FlashType.Error);
        if (status === 401) {
          this.router.navigate([ '/user/login' ], { queryParams: { returnUrl: `/blog/view/${this.blogId}` }});
        }
      }
    );
  }
  
  onEditBlogClicked () {
    this.router.navigate([ `/blog/edit/${this.blogId}` ]);
  }

  onDeleteBlogClicked () {
    const ays = confirm('Are you sure you want to delete this blog?');
    if (ays === true) {
      this.blog.deleteBlog(this.blogId).subscribe(
        response => {
          const { message } = response.json();

          this.flash.deploy(message, [], FlashType.OK);
          this.router.navigate([ '/user/dashboard' ]);
        },

        error =>  {
          const { status, message } = error.json().error;

          this.flash.deploy(message, [], FlashType.Error);
          if (status === 401) {
            this.router.navigate([ '/user/login' ], { queryParams: { returnUrl: '/user/dashboard' }});
          }
        }
      )
    }
  }

  onCommentNextPageClicked () {
    if (this.commentLastPage === false) {
      this.fetchBlogComments(this.commentPage + 1);
    }
  }

  onCommentPreviousPageClicked () {
    if (this.commentPage > 0) {
      this.fetchBlogComments(this.commentPage - 1);
    }
  }

}
