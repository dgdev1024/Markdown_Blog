import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { FlashService } from './flash.service';
import { BlogService } from './blog.service';
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
import { CreateBlogComponent } from './create-blog/create-blog.component';
import { ViewBlogComponent } from './view-blog/view-blog.component';
import { NoLoginGuard } from './no-login.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { EditBlogComponent } from './edit-blog/edit-blog.component';
import { SearchComponent } from './search/search.component';
import { ProfileComponent } from './profile/profile.component';
import { LogoutComponent } from './logout/logout.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [NoLoginGuard],
    component: HomeComponent
  },
  {
    path: 'user/dashboard',
    canActivate: [AuthGuard],
    component: DashboardComponent
  },
  {
    path: 'user/profile/:userId',
    component: ProfileComponent
  },
  {
    path: 'user/register',
    canActivate: [NoLoginGuard],
    component: RegisterComponent
  },
  {
    path: 'user/verify/:verifyId',
    canActivate: [NoLoginGuard],
    component: VerifyComponent
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
  },
  {
    path: 'blog/create',
    canActivate: [AuthGuard],
    component: CreateBlogComponent
  },
  {
    path: 'blog/edit/:blogId',
    canActivate: [AuthGuard],
    component: EditBlogComponent
  },
  {
    path: 'blog/view/:blogId',
    component: ViewBlogComponent
  },
  {
    path: 'blog/search',
    component: SearchComponent
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
    PwChangeComponent,
    CreateBlogComponent,
    ViewBlogComponent,
    DashboardComponent,
    EditBlogComponent,
    SearchComponent,
    ProfileComponent,
    LogoutComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(routes)
  ],
  providers: [FlashService, AuthService, AuthGuard, BlogService, NoLoginGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }
