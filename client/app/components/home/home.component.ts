import { Component, OnInit } from '@angular/core';
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

  private fetchHotBlogs () {
    this.hotBlogs = [];
    this.hotError = '';
    this.hotFetching = true;

    this.blogService.fetchHotBlogs().subscribe(
      response => {
        const { blogs } = response.json();

        this.hotBlogs = blogs.slice(0, 9);
        this.hotFetching = false;
      },

      error => {
        const { message } = error.json().error;
        this.hotError = message;
        this.hotFetching = false;
      }
    );
  }

  constructor(
    private blogService: BlogService
  ) { }

  ngOnInit() {
    this.fetchHotBlogs();
  }

  onSearchSubmit (ev) {
    ev.preventDefault();
  }

}
