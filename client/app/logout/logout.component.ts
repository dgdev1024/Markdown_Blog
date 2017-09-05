import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { FlashService, FlashType } from '../flash.service';

@Component({
  selector: 'app-logout',
  template: '',
  styles: []
})
export class LogoutComponent implements OnInit {

  constructor(
    private router: Router,
    private auth: AuthService,
    private flash: FlashService
  ) { }

  ngOnInit() {
    this.auth.clearToken();
    this.router.navigate([ '/' ]);
  }

}
