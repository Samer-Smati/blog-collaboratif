import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { Location, PopStateEvent, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class NavbarComponent implements OnInit {
  public isCollapsed = true;
  private lastPoppedUrl: string | undefined;
  private yScrollStack: number[] = [];

  constructor(public location: Location, private router: Router) {}

  ngOnInit() {}

  isHome() {
    var titlee = this.location.prepareExternalUrl(this.location.path());

    if (titlee === '#/home') {
      return true;
    } else {
      return false;
    }
  }
  isDocumentation() {
    var titlee = this.location.prepareExternalUrl(this.location.path());
    if (titlee === '#/documentation') {
      return true;
    } else {
      return false;
    }
  }
}
