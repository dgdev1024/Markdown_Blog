import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'
import { LoginService } from '../../services/login.service';
import { BlogService } from '../../services/blog.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styles: []
})
export class TopbarComponent implements OnInit {

  // On small screens, show the menu?
  private menuShown: boolean = false;

  constructor(
    private routerService: Router,
    private loginService: LoginService,
    private blogService: BlogService
  ) { }

  ngOnInit() {
  }

  // Toggles the menu on and off.
  toggleMenu () {
    this.menuShown = !this.menuShown;
  }

  // Turns the menu off.
  resetMenuToggle () {
    this.menuShown = false;
  }

  // Called when the user submits a search from the topbar.
  onSearchSubmit (ev) {
    ev.preventDefault();
    this.routerService.navigate([ '/blog/search' ], {
      queryParams: {
        query: this.blogService.searchQuery
      }
    });
  }

}
