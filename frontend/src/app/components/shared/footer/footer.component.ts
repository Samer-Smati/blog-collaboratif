import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class FooterComponent implements OnInit {
  test: Date = new Date();

  constructor(private router: Router) {}

  ngOnInit() {}
  getPath() {
    return this.router.url;
  }
}
