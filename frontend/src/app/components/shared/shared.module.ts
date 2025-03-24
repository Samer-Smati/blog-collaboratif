import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { NotFoundComponent } from './not-found/not-found.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    FooterComponent,
    NotFoundComponent,
  ],
  exports: [NavbarComponent, FooterComponent, NotFoundComponent],
})
export class SharedModule {}
