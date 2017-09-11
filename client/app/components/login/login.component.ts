import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styles: []
})
export class LoginComponent implements OnInit {

  // The URL to return the user to once login is completed.
  private returnUrl: string = '';

  // The email address and password to be submitted.
  private emailAddress: string = '';
  private password: string = '';

  constructor(
    private titleService: Title,
    private currentRoute: ActivatedRoute,
    private routerService: Router,
    private loginService: LoginService,
    private flashService: FlashService
  ) { }

  ngOnInit() {
    this.currentRoute.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/';
    });

    this.titleService.setTitle('Login - The Daily Markdown');
  }

  onSubmit (ev) {
    ev.preventDefault();

    this.loginService.attemptLogin(this.emailAddress, this.password).subscribe(
      () => {
        this.routerService.navigate([ this.returnUrl ], { replaceUrl: true });
      },

      error => {
        const { message } = error.json().error;

        this.flashService.deploy(message, [], FlashType.Error);
      }
    );
  }

}
