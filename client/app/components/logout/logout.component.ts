import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-logout',
  template: '',
  styles: []
})
export class LogoutComponent implements OnInit {

  constructor(
    private routerService: Router,
    private loginService: LoginService
  ) { }

  ngOnInit() {
    this.loginService.clearToken();
    this.routerService.navigate([ '/' ], { replaceUrl: true });
  }

}
