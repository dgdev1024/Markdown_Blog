import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BlogService } from '../blog.service';

@Component({
  selector: 'app-search',
  templateUrl: 'search.component.html',
  styles: []
})
export class SearchComponent implements OnInit {

  private query: string = '';
  private fetching: boolean = false;
  private error: string = '';
  private blogs: any[] = [];
  private page: number = 0;
  private lastPage: boolean = true;

  private fetchBlogs (page: number = 0) {
    this.fetching = true;
    this.error = '';
    this.blogs = [];
    this.page = page;
    this.lastPage = false;

    this.blog.fetchBlogsByKeyword(this.query, page).subscribe(
      response => {
        const { blogs, lastPage } = response.json();
        this.blogs = blogs;
        this.lastPage = lastPage;
        this.fetching = false;
      },

      error => {
        const { message } = error.json().error;
        this.error = message;
        this.fetching = false;
      }
    );
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private blog: BlogService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.query = params['query'];
      this.page = parseInt(params['page'] || 0);

      this.fetchBlogs(this.page);
    });
  }

  onPreviousClicked () {
    if (this.page > 0) {
      this.router.navigate([ '/blog/search' ], { queryParams: { query: this.query, page: this.page - 1 }});
    }
  }

  onNextClicked () {
    if (this.lastPage === false) {
      this.router.navigate([ '/blog/search' ], { queryParams: { query: this.query, page: this.page + 1 }});
    }
  }

}
