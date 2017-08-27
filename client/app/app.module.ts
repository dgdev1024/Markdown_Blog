import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { FlashService } from './flash.service';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { HomeComponent } from './home/home.component';
import { TopbarComponent } from './topbar/topbar.component';
import { FlashComponent } from './flash/flash.component';
import { RegisterComponent } from './register/register.component';
import { VerifyComponent } from './verify/verify.component';
import { LoginComponent } from './login/login.component';
import { PwResetRequestComponent } from './pw-reset-request/pw-reset-request.component';
import { PwResetAuthComponent } from './pw-reset-auth/pw-reset-auth.component';
import { PwChangeComponent } from './pw-change/pw-change.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent
  },
  {
    path: 'user/register',
    component: RegisterComponent
  },
  {
    path: 'user/verify/:verifyId',
    component: VerifyComponent
  },
  {
    path: 'user/login',
    component: LoginComponent
  },
  {
    path: 'user/requestPasswordReset',
    component: PwResetRequestComponent
  },
  {
    path: 'user/authenticatePasswordReset/:tokenId',
    component: PwResetAuthComponent
  },
  {
    path: 'user/changePassword/:tokenId',
    component: PwChangeComponent
  }
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    TopbarComponent,
    FlashComponent,
    RegisterComponent,
    VerifyComponent,
    LoginComponent,
    PwResetRequestComponent,
    PwResetAuthComponent,
    PwChangeComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(routes)
  ],
  providers: [FlashService, AuthService, AuthGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }
