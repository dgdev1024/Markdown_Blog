import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BlogService } from '../../services/blog.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styles: []
})
export class HomeComponent implements OnInit {

  private hotFetching: boolean = false;
  private hotError: string = '';
  private hotBlogs: any[] = [];
  private hotPage: number = 0;
  private hotLastPage: boolean = false;

  private fetchHotBlogs (page: number = 0) {
    this.hotBlogs = [];
    this.hotError = '';
    this.hotFetching = true;
    this.hotPage = page;

    this.blogService.fetchHotBlogs().subscribe(
      response => {
        const { blogs, lastPage } = response.json();

        if (blogs.length === 0 && this.hotPage > 0) {
          this.fetchHotBlogs(0);
          return;
        }

        this.hotBlogs = blogs;
        this.hotLastPage = lastPage;
        this.hotFetching = false;
        this.locationService.replaceState(
          '/',
          `hotPage=${this.hotPage}`
        );
      },

      error => {
        const { status, message } = error.json().error;
        
        if (status === 404 && this.hotPage > 0) {
          this.fetchHotBlogs(0);
          return;
        }
        
        this.hotError = message;
        this.hotFetching = false;
      }
    );
  }

  constructor(
    private titleService: Title,
    private locationService: Location,
    private activatedRoute: ActivatedRoute,
    private routerService: Router,
    private blogService: BlogService
  ) { }

  ngOnInit() {
    this.fetchHotBlogs();
    this.titleService.setTitle('The Daily Markdown');
  }

  onPreviousClicked () {
    if (this.hotPage > 0) { this.fetchHotBlogs(this.hotPage - 1); }
  }

  onNextClicked () {
    if (this.hotLastPage === false) { this.fetchHotBlogs(this.hotPage + 1); }
  }

  onSearchSubmit (ev) {
    ev.preventDefault();
    this.routerService.navigate([ '/blog/search' ], {
      queryParams: {
        query: this.blogService.searchQuery
      }
    });
  }

}
