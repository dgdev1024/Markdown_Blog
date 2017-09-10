import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { FlashService } from './services/flash.service';
import { FlashComponent } from './components/flash/flash.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { HomeComponent } from './components/home/home.component';
import { LoginGuard } from './guards/login.guard';
import { NoLoginGuard } from './guards/no-login.guard';
import { LoginService } from './services/login.service';
import { UserService } from './services/user.service';
import { BlogService } from './services/blog.service';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { VerifyComponent } from './components/verify/verify.component';
import { BlogComponent } from './components/blog/blog.component';
import { PwResetRequestComponent } from './components/pw-reset-request/pw-reset-request.component';
import { PwResetAuthComponent } from './components/pw-reset-auth/pw-reset-auth.component';
import { PwResetComponent } from './components/pw-reset/pw-reset.component';
import { BlogEditorComponent } from './components/blog-editor/blog-editor.component';
import { ProfileComponent } from './components/profile/profile.component';
import { LogoutComponent } from './components/logout/logout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SearchComponent } from './components/search/search.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [NoLoginGuard],
    component: HomeComponent
  },
  {
    path: 'user/dashboard',
    canActivate: [LoginGuard],
    component: DashboardComponent
  },
  {
    path: 'user/login',
    canActivate: [NoLoginGuard],
    component: LoginComponent
  },
  {
    path: 'user/logout',
    component: LogoutComponent
  },
  {
    path: 'user/register',
    canActivate: [NoLoginGuard],
    component: RegisterComponent
  },
  {
    path: 'user/verify/:verifyId',
    component: VerifyComponent
  },
  {
    path: 'user/requestPasswordReset',
    component: PwResetRequestComponent
  },
  {
    path: 'user/authenticatePasswordReset/:authenticateId',
    component: PwResetAuthComponent
  },
  {
    path: 'user/changePassword/:authenticateId',
    component: PwResetComponent
  },
  {
    path: 'user/profile/:userId',
    component: ProfileComponent
  },
  {
    path: 'blog/search',
    component: SearchComponent
  },
  {
    path: 'blog/view/:blogId',
    component: BlogComponent
  },
  {
    path: 'blog/editor',
    canActivate: [LoginGuard],
    component: BlogEditorComponent
  }
];

@NgModule({
  declarations: [
    AppComponent, 
    FlashComponent, TopbarComponent, HomeComponent, LoginComponent, RegisterComponent, VerifyComponent, BlogComponent, PwResetRequestComponent, PwResetAuthComponent, PwResetComponent, BlogEditorComponent, ProfileComponent, LogoutComponent, DashboardComponent, SearchComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(routes)
  ],
  providers: [FlashService, LoginGuard, NoLoginGuard, LoginService, UserService, BlogService],
  bootstrap: [AppComponent]
})
export class AppModule { }
