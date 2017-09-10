import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { BlogService } from '../../services/blog.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styles: []
})
export class DashboardComponent implements OnInit {

  // The logged-in user's ID.
  private userId: string = '';

  // Fetching flags.
  private subBlogsFetching: boolean = false;
  private hotBlogsFetching: boolean = false;

  // Subscription blogs.
  private subBlogs: any[] = [];
  private subBlogsPage: number = 0;
  private subBlogsLastPage: boolean = true;
  private subBlogsError: string = '';

  // Hot blogs.
  private hotBlogs: any[] = [];
  private hotBlogsPage: number = 0;
  private hotBlogsLastPage: boolean = true;
  private hotBlogsError: string = '';

  private fetchSubBlogs (page: number = 0) {
    this.subBlogsError = '';
    this.subBlogsPage = page;
    this.subBlogsFetching = true;

    this.blogService.fetchBlogsBySubscriptions(this.subBlogsPage).subscribe(
      response => {
        const { blogs, lastPage } = response.json();
        
        if (blogs.length === 0 && this.subBlogsPage > 0) {
          this.fetchHotBlogs(0);
          this.locationService.replaceState(
            '/user/dashboard',
            `subPage=0&hotPage=${this.hotBlogsPage}`
          );
        }

        this.subBlogs = blogs;
        this.subBlogsLastPage = lastPage;
        this.subBlogsFetching = false;
        this.locationService.replaceState(
          '/user/dashboard',
          `subPage=${this.subBlogsPage}&hotPage=${this.hotBlogsPage}`
        );
      },

      error => {
        const { status, message } = error.json().error;
        
        if (status === 404 && this.subBlogsPage > 0) {
          this.fetchSubBlogs(0);
          this.locationService.replaceState(
            '/user/dashboard',
            `subPage=0&hotPage=${this.hotBlogsPage}`
          );
        }

        this.subBlogsError = message;
        this.subBlogsFetching = false;
      }
    );
  }

  private fetchHotBlogs (page: number = 0) {
    this.hotBlogsError = '';
    this.hotBlogsPage = page;
    this.hotBlogsFetching = true;

    this.blogService.fetchHotBlogs(this.hotBlogsPage).subscribe(
      response => {
        const { blogs, lastPage } = response.json();
        
        if (blogs.length === 0 && this.hotBlogsPage > 0) {
          this.fetchHotBlogs(0);
          this.locationService.replaceState(
            '/user/dashboard',
            `subPage=${this.subBlogsPage}&hotPage=0`
          );
        }

        this.hotBlogs = blogs;
        this.hotBlogsLastPage = lastPage;
        this.hotBlogsFetching = false;
        this.locationService.replaceState(
          '/user/dashboard',
          `subPage=${this.subBlogsPage}&hotPage=${this.hotBlogsPage}`
        );
      },

      error => {
        const { status, message } = error.json().error;

        if (status === 404 && this.hotBlogsPage > 0) {
          this.fetchHotBlogs(0);
          this.locationService.replaceState(
            '/user/dashboard',
            `subPage=${this.subBlogsPage}&hotPage=0`
          );
        }

        this.hotBlogsError = message;
        this.hotBlogsFetching = false;
      }
    );
  }

  constructor(
    private locationService: Location,
    private routerService: Router,
    private activatedRoute: ActivatedRoute,
    private loginService: LoginService,
    private blogService: BlogService
  ) { }

  ngOnInit() {
    const token = this.loginService.getToken();
    if (!token) {
      this.routerService.navigate([ '/user/login' ], { replaceUrl: true });
      return;
    }

    this.userId = token.id;
    this.activatedRoute.queryParams.subscribe(params => {
      this.subBlogsPage = parseInt(params['subPage']) || 0;
      this.hotBlogsPage = parseInt(params['hotPage']) || 0;

      this.fetchSubBlogs(this.subBlogsPage);
      this.fetchHotBlogs(this.hotBlogsPage);
    });
  }

  onPreviousClicked (list) {
    switch (list) {
      case 'subs': if (this.subBlogsPage > 0) { this.fetchSubBlogs(this.subBlogsPage - 1); } break;
      case 'hot':  if (this.hotBlogsPage > 0) { this.fetchHotBlogs(this.hotBlogsPage - 1); } break;
    }
  }

  onNextClicked (list) {
    switch (list) {
      case 'subs': if (this.subBlogsLastPage === false) { this.fetchSubBlogs(this.subBlogsPage + 1); } break;
      case 'hot':  if (this.hotBlogsLastPage === false) { this.fetchHotBlogs(this.hotBlogsPage + 1); } break;
    }
  }

}
