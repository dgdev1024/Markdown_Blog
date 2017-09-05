import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styles: []
})
export class HomeComponent implements OnInit {

  private searchQuery: string = '';

  constructor(private auth: AuthService) { }

  ngOnInit() {
  }

}
