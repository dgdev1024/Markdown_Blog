import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-topbar',
  templateUrl: 'topbar.component.html',
  styles: []
})
export class TopbarComponent implements OnInit {

  showMenu: boolean = false;
  searchQuery: string = '';

  constructor(private auth: AuthService, private router: Router) { }

  toggleMenu () {
    this.showMenu = !this.showMenu;
  }

  resetToggle () {
    this.showMenu = false;
  }

  onSearchSubmit (ev) {
    ev.preventDefault();
    
    if (this.searchQuery) {
      this.router.navigate([ '/blog/search' ], { queryParams: { query: this.searchQuery }});
      this.resetToggle();
    }
  }

  ngOnInit() {
  }

}
