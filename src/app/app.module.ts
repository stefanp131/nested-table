import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NestedTableComponent } from './nested-table/nested-table.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ResizeColumnDirective } from './directives/resize-column.directive';

@NgModule({
  declarations: [
    AppComponent,
    NestedTableComponent,
    ResizeColumnDirective,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule, 
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
