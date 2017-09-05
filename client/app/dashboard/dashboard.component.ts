import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { BlogService } from '../blog.service';
import { FlashService, FlashType } from '../flash.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.component.html',
  styles: []
})
export class DashboardComponent implements OnInit {

  private userId: string = '';

  private userFullName: string = '';
  private userBlogs: any[] = [];
  private userBlogsFetching: boolean = false;
  private userBlogsError: string = '';
  private userBlogsPage: number = 0;
  private userBlogsLastPage: boolean = true;

  private subBlogs: any[] = [];
  private subBlogsFetching: boolean = false;
  private subBlogsError: string = '';
  private subBlogsPage: number = 0;
  private subBlogsLastPage: boolean = true;

  private recentBlogs: any[] = [];
  private recentBlogsFetching: boolean = false;
  private recentBlogsError: string = '';
  private recentBlogsPage: number = 0;
  private recentBlogsLastPage: boolean = true;

  private loadMyBlogs (page: number = 0) {
    this.userBlogs = [];
    this.userBlogsFetching = true;
    this.userBlogsError = '';

    this.blog.fetchUserBlogs(this.userId, page).subscribe(
      response => {
        const { blogs, lastPage } = response.json();

        this.userBlogs = blogs;
        this.userBlogsLastPage = lastPage;
        this.userBlogsPage = page;
        this.userBlogsFetching = false;
      },

      error => {
        const { status, message } = error.json().error;

        this.userBlogsError = message;
        this.userBlogsFetching = false;

        if (status === 401) {
          this.flash.deploy('Please log in again.', [], FlashType.Error);
          this.router.navigate([ 'user/login' ], { queryParams: { returnUrl: '/user/dashboard' }});
        }
        if (status === 404) {
          this.userBlogsError = 'You do not have any blogs, yet!'
        }
      }
    );
  }

  private loadSubscriptionBlogs (page: number = 0) {
    this.subBlogs = [];
    this.subBlogsFetching = true;
    this.subBlogsError = '';

    this.blog.fetchBlogsBySubscriptions(page).subscribe(
      response => {
        const { blogs, lastPage } = response.json();

        this.subBlogs = blogs;
        this.subBlogsLastPage = lastPage;
        this.subBlogsPage = page;
        this.subBlogsFetching = false;
      },

      error => {
        const { status, message } = error.json().error;

        this.subBlogsError = message;
        this.subBlogsFetching = false;

        if (status === 401) {
          this.flash.deploy('Please log in again.', [], FlashType.Error);
          this.router.navigate([ 'user/login' ], { queryParams: { returnUrl: '/user/dashboard' }});
        }
      }
    );
  }

  private loadRecentBlogs (page: number = 0) {
    this.recentBlogs = [];
    this.recentBlogsFetching = true;
    this.recentBlogsError = '';

    this.blog.fetchRecentBlogs(page).subscribe(
      response => {
        const { blogs, lastPage } = response.json();

        this.recentBlogs = blogs;
        this.recentBlogsLastPage = lastPage;
        this.recentBlogsPage = page;
        this.recentBlogsFetching = false;
      },

      error => {
        const { message } = error.json().error;

        this.recentBlogsError = message;
        this.recentBlogsFetching = false;
      }
    );
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private blog: BlogService,
    private flash: FlashService
  ) { }

  ngOnInit() {
    const token = this.auth.getToken();

    if (!token) {
      this.router.navigate([ '/user/login' ], { queryParams: { returnUrl: '/user/dashboard' }});
    } else {
      this.userId = token.id;
      this.userFullName = token.fullName;

      this.loadMyBlogs();
      this.loadSubscriptionBlogs();
      this.loadRecentBlogs();
    }
  }

  onEditBlogClicked (id) {
    this.router.navigate([ `/blog/edit/${id}` ]);
  }

  onDeleteBlogClicked (id) {
    const ays = confirm('Are you sure you want to delete this blog?');
    if (ays === true) {
      this.blog.deleteBlog(id).subscribe(
        response => {
          const { message } = response.json();

          this.flash.deploy(message, [], FlashType.OK);
          this.loadMyBlogs(this.userBlogsPage);
          this.loadRecentBlogs(this.recentBlogsPage);
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

  onPreviousClicked (listName: string) {
    switch (listName) {
      case 'user': if (this.userBlogsPage > 0) { this.loadMyBlogs(this.userBlogsPage - 1); } break;
      case 'subs': if (this.subBlogsPage > 0) { this.loadSubscriptionBlogs(this.subBlogsPage - 1); } break;
      case 'all':  if (this.recentBlogsPage > 0) { this.loadRecentBlogs(this.recentBlogsPage - 1); } break;
    }
  }

  onNextClicked (listName: string) {
    switch (listName) {
      case 'user': if (this.userBlogsLastPage === false) { this.loadMyBlogs(this.userBlogsPage + 1); } break;
      case 'subs': if (this.subBlogsLastPage === false) { this.loadSubscriptionBlogs(this.subBlogsPage + 1); } break;
      case 'all':  if (this.recentBlogsLastPage === false) { this.loadRecentBlogs(this.recentBlogsPage + 1); } break;
    }
  }

}
