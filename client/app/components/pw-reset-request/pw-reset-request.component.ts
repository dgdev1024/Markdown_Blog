import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-pw-reset-request',
  templateUrl: './pw-reset-request.component.html',
  styles: []
})
export class PwResetRequestComponent implements OnInit {

  // User Input
  private emailAddress: string = '';

  constructor(
    private titleService: Title,
    private routerService: Router,
    private userService: UserService,
    private flashService: FlashService
  ) { }

  ngOnInit() {
    this.titleService.setTitle('Request a Password Reset - The Daily Markdown');
  }

  onSubmit (ev) {
    ev.preventDefault();

    this.userService.requestPasswordReset(this.emailAddress).subscribe(
      response => {
        const { message, link } = response.json();

        this.flashService.deploy(message, [], FlashType.OK);
        this.routerService.navigate([ `/user/authenticatePasswordReset/${link}` ]);
      },

      error => {
        const { message } = error.json().error;
        
        this.flashService.deploy(message, [], FlashType.Error);
      }
    );
  }

}
