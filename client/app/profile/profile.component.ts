import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { BlogService } from '../blog.service';
import { FlashService, FlashType } from '../flash.service';
import * as moment from 'moment';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.component.html',
  styles: []
})
export class ProfileComponent implements OnInit {

  // Fetching flags.
  private fetchingUser: boolean = false;
  private fetchingBlogs: boolean = false;
  private fetchingSubs: boolean = false;

  // The logged-in user's ID.
  private myId: string = '';
  private isMe: boolean = false;

  // Details on the target user.
  private targetId: string = '';
  private targetName: string = '';
  private targetEmail: string = '';
  private targetJoinDate: string = '';
  private targetBlogCount: number = 0;
  private targetSubCount: number = 0;
  private targetError: string = '';

  // The list of the target user's blogs.
  private blogs: any[] = [];
  private blogsPage: number = 0;
  private blogsLastPage: boolean = true;
  private blogsError: string = '';

  // The list of the target's subscriptions.
  private subs: any[] = [];
  private subsPage: number = 0;
  private subsLastPage: boolean = true;
  private subsError: string = '';

  // Is my user subscribed to the target?
  private isSubbed: boolean = false;

  private fetchTargetProfile () {
    this.isMe = (this.myId === this.targetId);
    this.targetName = '';
    this.targetEmail = '';
    this.targetJoinDate = '';
    this.targetBlogCount = 0;
    this.targetSubCount = 0;
    this.targetError = '';
    this.isSubbed = false;
    this.fetchingUser = true;

    this.auth.fetchUserProfile(this.targetId).subscribe(
      response => {
        const target = response.json();

        this.targetName = target.fullName;
        this.targetEmail = target.emailAddress;
        this.targetJoinDate = moment(target.joinDate).format('MMMM Do, YYYY');
        this.targetBlogCount = target.blogCount;
        this.targetSubCount = target.subscriptionCount;
        this.fetchingUser = false;
      },

      error => {
        const { message } = error.json().error;

        this.targetError = message;
        this.fetchingUser = false;
      }
    );
  }

  private fetchTargetBlogs (page: number = 0) {
    this.blogs = [];
    this.blogsPage = page;
    this.blogsError = '';
    this.fetchingBlogs = true;

    this.blog.fetchUserBlogs(this.targetId, this.blogsPage).subscribe(
      response => {
        const { blogs, lastPage } = response.json();

        this.blogs = blogs;
        this.blogsLastPage = lastPage;
        this.fetchingBlogs = false;
      },

      error => {
        const { status, message } = error.json().error;

        this.blogsError = message;
        this.fetchingBlogs = false;
      }
    );
  }

  private fetchTargetSubscriptions (page: number = 0) {
    this.subs = [];
    this.subsPage = page;
    this.subsError = '';
    this.fetchingSubs = true;

    this.auth.fetchUserSubs(this.targetId, this.subsPage).subscribe(
      response => {
        const { all, subscriptions, lastPage } = response.json();

        this.subs = subscriptions;
        this.subsLastPage = lastPage;
        this.fetchingSubs = false;
      },

      error => {
        const { status, message } = error.json().error;

        this.subsError = message;
        this.fetchingSubs = false;
      }
    );
  }

  private amISubscribed () {
    this.isSubbed = false;

    if (this.myId !== '' && this.myId !== this.targetId) {
      this.auth.fetchUserSubs(this.myId, 0).subscribe(
        response => {
          const { all } = response.json();
          this.isSubbed = (all.indexOf(this.targetId) !== -1);
        },

        error => {
          const { status, message } = error.json().error;

          if (status !== 404) {
            this.flash.deploy(
              `Error determining subscription status: ${message}`, 
              [], FlashType.Error
            );
          }
        }
      )
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private blog: BlogService,
    private flash: FlashService
  ) { }

  ngOnInit() {
    // Fetch my user ID, if I am logged in.
    const token = this.auth.getToken();
    if (token) { this.myId = token.id; }

    // Get the target user ID from the route parameters.
    this.route.params.subscribe(params => {
      this.targetId = params['userId'];
      this.fetchTargetProfile();
      this.fetchTargetBlogs();
      this.fetchTargetSubscriptions();
      this.amISubscribed();
    });
  }

  toggleSubscribe (ev) {
    ev.preventDefault();
    
    if (this.isSubbed === true) {
      this.blog.unsubscribeFromUser(this.targetId).subscribe(
        response => {
          const { message } = response.json();
          this.flash.deploy(message, [], FlashType.OK);
          this.isSubbed = false;
        },

        error => {
          const { message, status } = error.json().error;

          this.flash.deploy(message, [], FlashType.Error);

          if (status === 401) {
            this.router.navigate([ '/user/login' ], { queryParams: { returnUrl: `/user/profile/${this.targetId}` }});
          }
        }
    );
    }
    else {
      this.blog.subscribeToUser(this.targetId).subscribe(
        response => {
          const { message } = response.json();
          this.flash.deploy(message, [], FlashType.OK);
          this.isSubbed = true;
        },

        error => {
          const { message, status } = error.json().error;

          this.flash.deploy(message, [], FlashType.Error);

          if (status === 401) {
            this.router.navigate([ '/user/login' ], { queryParams: { returnUrl: `/user/profile/${this.targetId}` }});
          }
        }
      );
    }
  }

}
