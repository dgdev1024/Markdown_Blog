import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-pw-reset',
  templateUrl: './pw-reset.component.html',
  styles: []
})
export class PwResetComponent implements OnInit {

  private authenticateId: string = '';
  private password: string = '';
  private confirm: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private routerService: Router,
    private userService: UserService,
    private flashService: FlashService
  ) { }

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.authenticateId = params['authenticateId'];
    });
  }

  onSubmit (ev) {
    ev.preventDefault();

    this.userService.changePassword(
      this.authenticateId,
      this.password,
      this.confirm
    ).subscribe(
      response => {
        const { message } = response.json();

        this.flashService.deploy(message, [], FlashType.OK);
        this.routerService.navigate([ `/` ], { replaceUrl: true });
      },

      error => {
        const { message } = error.json().error;
        
        this.flashService.deploy(message, [], FlashType.Error);
      }
    );
  }

}
