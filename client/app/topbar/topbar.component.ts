import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-topbar',
  templateUrl: 'topbar.component.html',
  styles: []
})
export class TopbarComponent implements OnInit {

  showMenu: boolean = false;

  constructor() { }

  toggleMenu () {
    this.showMenu = !this.showMenu;
  }

  resetToggle () {
    this.showMenu = false;
  }

  ngOnInit() {
  }

}
