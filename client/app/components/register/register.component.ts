import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styles: []
})
export class RegisterComponent implements OnInit {

  // The user's registration credentials.
  private firstName: string = '';
  private lastName: string = '';
  private emailAddress: string = '';
  private password: string = '';
  private confirm: string = '';

  constructor(
    private routerService: Router,
    private userService: UserService,
    private flashService: FlashService
  ) { }

  ngOnInit() {
  }

  onSubmit (ev) {
    ev.preventDefault();

    this.userService.registerLocal(
      this.firstName,
      this.lastName,
      this.emailAddress,
      this.password,
      this.confirm
    ).subscribe(
      response => {
        const { message } = response.json();

        this.flashService.deploy(message, [], FlashType.OK);
        this.routerService.navigate([ '/' ], { replaceUrl: true });
      },

      error => {
        const { message, details } = error.json().error;

        this.flashService.deploy(message, details ? details : [], FlashType.Error);
      }
    );
  }

}
