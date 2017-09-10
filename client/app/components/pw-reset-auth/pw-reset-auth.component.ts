import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-pw-reset-auth',
  templateUrl: './pw-reset-auth.component.html',
  styles: []
})
export class PwResetAuthComponent implements OnInit {

  // Authentication Details
  private authenticationId: string = '';
  private authenticationCode: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private routerService: Router,
    private userService: UserService,
    private flashService: FlashService
  ) { }

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.authenticationId = params['authenticateId'];
    })
  }

  onSubmit (ev) {
    ev.preventDefault();

    this.userService.authenticatePasswordReset(this.authenticationId, this.authenticationCode).subscribe(
      response => {
        const { message } = response.json();

        this.flashService.deploy(message, [], FlashType.OK);
        this.routerService.navigate([ `/user/changePassword/${this.authenticationId}` ]);
      },

      error => {
        const { message } = error.json().error;
        
        this.flashService.deploy(message, [], FlashType.Error);
      }
    );
  }

}
