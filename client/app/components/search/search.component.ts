import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BlogService } from '../../services/blog.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styles: []
})
export class SearchComponent implements OnInit {

  private query: string = '';
  private fetching: boolean = false;
  private blogs: any[] = [];
  private page: number = 0;
  private lastPage: boolean = true;
  private error: string = '';

  private fetchResults (page) {
    this.error = '';
    this.fetching = true;
    this.page = page;

    if (this.query === '') {
      this.blogService.fetchRecentBlogs(this.page).subscribe(
        response => {
          const { blogs, lastPage } = response.json();

          if (blogs.length === 0 && this.page > 0) {
            this.fetchResults(0);
            return;
          }

          console.log(blogs);

          this.blogs = blogs;
          this.lastPage = lastPage;
          this.fetching = false;
          this.locationService.replaceState(
            '/blog/search',
            `page=${this.page}`
          );
        },

        error => {
          const { status, message } = error.json().error;

          if (status === 404 && this.page > 0) {
            this.fetchResults(0);
            return;
          }

          this.error = message;
          this.fetching = false;
        }
      );
    } else {
      this.blogService.fetchBlogsByKeyword(this.query, this.page).subscribe(
        response => {
          const { blogs, lastPage } = response.json();

          if (blogs.length === 0 && this.page > 0) {
            this.fetchResults(0);
            return;
          }

          this.blogs = blogs;
          this.lastPage = lastPage;
          this.fetching = false;
          this.locationService.replaceState(
            '/blog/search',
            `query=${this.query}&page=${this.page}`
          );
        },

        error => {
          const { status, message } = error.json().error;

          if (status === 404 && this.page > 0) {
            this.fetchResults(0);
            return;
          }

          this.error = message;
          this.fetching = false;
        }
      );
    }
  }

  constructor(
    private locationService: Location,
    private activatedRoute: ActivatedRoute,
    private routerService: Router,
    private blogService: BlogService
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.query = params['query'] || '';
      this.page = parseInt(params['page']) || 0;
      this.fetchResults(this.page);
    });
  }

  onPrevClicked () {
    if (this.page > 0) {
      this.fetchResults(this.page - 1);
    }
  }

  onNextClicked () {
    if (this.lastPage === false) {
      this.fetchResults(this.page + 1);
    }
  }

}
