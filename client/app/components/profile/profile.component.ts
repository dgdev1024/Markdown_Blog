import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { UserService } from '../../services/user.service';
import { BlogService } from '../../services/blog.service';
import { FlashService, FlashType } from '../../services/flash.service';
import * as moment from 'moment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styles: []
})
export class ProfileComponent implements OnInit {

  // Fetching Flags
  private userFetching: boolean = false;
  private subsFetching: boolean = false;
  private blogsFetching: boolean = false;

  // User Details.
  private myId: string = '';
  private userId: string = '';
  private userFullName: string = '';
  private userEmailAddress: string = '';
  private userJoinDate: string = '';
  private userSubCount: number = 0;
  private userBlogCount: number = 0;
  private userError: string = '';

  // User Subscriptions List
  private subs: any[] = [];
  private subsPage: number = 0;
  private subsLastPage: boolean = true;
  private subsError: string = '';
  private isSubscribed: boolean = false;

  // User Blogs
  private blogs: any[] = [];
  private blogsPage: number = 0;
  private blogsLastPage: boolean = true;
  private blogsError: string = '';

  private fetchUserProfile () {
    this.userError = '';
    this.userFetching = true;

    this.userService.fetchUserProfile(this.userId).subscribe(
      response => {
        const profile = response.json();

        this.userFullName = profile.fullName;
        this.userEmailAddress = profile.emailAddress;
        this.userJoinDate = moment(profile.joinDate).format('MMMM Do, YYYY');
        this.userSubCount = profile.subscriptionCount;
        this.userBlogCount = profile.blogCount;
        this.titleService.setTitle(`${profile.fullName}'s Profile - The Daily Markdown`);

        if (this.myId !== '') {
          this.userService.isUserSubscribed(this.myId, this.userId).subscribe(
            response => { this.isSubscribed = response.json().subscribed; },
            () => {}
          )
        }

        this.userFetching = false;
      },

      error => {
        const { message } = error.json().error;

        this.userError = message;
        this.userFetching = false;
        this.titleService.setTitle('Error Fetching Profile - The Daily Markdown');
      }
    );
  }

  private fetchUserSubs (page: number = 0) {
    this.subsPage = page;
    this.subsError = '';
    this.subsFetching = true;

    this.userService.fetchUserSubscriptions(this.userId, this.subsPage).subscribe(
      response => {
        const { subscriptions, lastPage } = response.json();

        if (subscriptions.length === 0 && this.subsPage > 0) {
          this.fetchUserSubs(0);
        }

        this.subs = subscriptions;
        this.subsLastPage = lastPage;
        this.subsFetching = false;
        this.locationService.replaceState(
          `/user/profile/${this.userId}`,
          `subsPage=${this.subsPage}&blogsPage=${this.blogsPage}`
        );
      },

      error => {
        const { status, message } = error.json().error;

        if (status === 404 && this.subsPage > 0) {
          this.fetchUserSubs(0);
        } else {
          this.subsError = message;
          this.subsFetching = false;
        }
      }
    );
  }

  private fetchUserBlogs (page: number = 0) {
    this.blogsPage = page;
    this.blogsError = '';
    this.blogsFetching = true;

    this.userService.fetchUserBlogs(this.userId, this.blogsPage).subscribe(
      response => {
        const { blogs, lastPage } = response.json();

        if (blogs.length === 0 && this.blogsPage > 0) {
          this.fetchUserBlogs(0);
        }

        this.blogs = blogs;
        this.blogsLastPage = lastPage;
        this.blogsFetching = false;
        this.locationService.replaceState(
          `/user/profile/${this.userId}`,
          `subsPage=${this.subsPage}&blogsPage=${this.blogsPage}`
        );
      },

      error => {
        const { status, message } = error.json().error;

        if (status === 404 && this.blogsPage > 0) {
          this.fetchUserBlogs(0);
        } else {
          this.blogsError = message;
          this.blogsFetching = false;
        }
      }
    );
  }

  constructor(
    private titleService: Title,
    private activatedRoute: ActivatedRoute,
    private routerService: Router,
    private locationService: Location,
    private loginService: LoginService,
    private userService: UserService,
    private blogService: BlogService,
    private flashService: FlashService
  ) { }

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.userId = params['userId'];

      const token = this.loginService.getToken();
      if (token) {
        this.myId = token.id;
      } else {
        this.myId = '';
      }

      this.activatedRoute.queryParams.subscribe(params => {
        this.subsPage = parseInt(params['subsPage']) || 0;
        this.blogsPage = parseInt(params['blogsPage']) || 0;

        this.fetchUserProfile();
        this.fetchUserSubs(this.subsPage);
        this.fetchUserBlogs(this.blogsPage);
      });
    });
  }

  onNextClicked (list) {
    switch (list) {
      case 'subs':
        if (this.subsLastPage === false) {
          this.fetchUserSubs(this.subsPage + 1);
        }
        break;
      case 'blogs':
        if (this.blogsLastPage === false) { 
          this.fetchUserBlogs(this.blogsPage + 1);
        }
        break;
    }
  }

  onPreviousClicked (list) {
    switch (list) {
      case 'subs':
        if (this.subsPage > 0) {
          this.fetchUserSubs(this.subsPage - 1);
        }
        break;
      case 'blogs':
        if (this.blogsPage > 0) { 
          this.fetchUserBlogs(this.blogsPage - 1);
        }
        break;
    }
  }

  onEditBlogClicked (id) {
    this.routerService.navigate([ '/blog/editor' ], {
      queryParams: {
        mode: 'edit',
        blogId: id
      }
    });
  }

  onUnsubscribeClicked (id) {
    this.userService.unsubscribeFromUser(id).subscribe(
      response => {
        const { message } = response.json();

        this.flashService.deploy(message, [], FlashType.OK);
        this.fetchUserSubs();
      },
      error => {
        const { status, message } = error.json().error;

        this.flashService.deploy(message, [], FlashType.Error);

        if (status === 401) {
          this.routerService.navigate([ '/user/login' ], { queryParams: { returnUrl: `/user/profile/${this.userId}` }});
        }
      }
    );
  }

  onDeleteBlogClicked (id) {
    const ays = confirm(
      'This wil delete the blog. Are you sure?'
    );

    if (ays === true) {
      this.blogService.deleteBlog(id).subscribe(
        response => {
          const { message } = response.json();
          
          this.flashService.deploy(message, [], FlashType.OK);
          this.fetchUserBlogs(this.blogsPage);
          this.userBlogCount--;
        },
        
        error => {
          const { status, message } = error.json().error;
  
          if (status === 401) {
            this.routerService.navigate([ '/user/login' ], { queryParams: { returnUrl: `/user/profile/${this.userId}` }});
          } else {
            this.flashService.deploy(message, [], FlashType.Error);
          }
        }
      )
    }
  }

  toggleSubscribe (ev) {
    ev.preventDefault();
    const token = this.loginService.getToken();

    if (token) {
      this.userService.isUserSubscribed(token.id, this.userId).subscribe(
        response => { 
          const isSubscribed = response.json().subscribed; 
          this.isSubscribed = isSubscribed;

          if (isSubscribed) {
            this.userService.unsubscribeFromUser(this.userId).subscribe(
              response => {
                const { message } = response.json();

                this.flashService.deploy(message, [], FlashType.OK);
                this.isSubscribed = false;
              },
              error => {
                const { message } = error.json().error;

                this.flashService.deploy(message, [], FlashType.Error);
              }
            );
          } else {
            this.userService.subscribeToUser(this.userId).subscribe(
              response => {
                const { message } = response.json();

                this.flashService.deploy(message, [], FlashType.OK);
                this.isSubscribed = true;
              },
              error => {
                const { message } = error.json().error;

                this.flashService.deploy(message, [], FlashType.Error);
              }
            );
          }
        },
        error => { 
          const { message } = error.json().error;

          this.flashService.deploy(message, [], FlashType.Error);
          this.isSubscribed = false; 
        }
      );
    } else {
      this.routerService.navigate([ '/user/login' ], { queryParams: { returnUrl: `/user/profile/${this.userId}` }});
    }
  }

}
