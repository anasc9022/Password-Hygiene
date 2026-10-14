import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { HomeComponent } from './components/home/home.component';
import { LabComponent } from './components/lab/lab.component';
import { QuizComponent } from './components/quiz/quiz.component';
import { ChecklistComponent } from './components/checklist/checklist.component';
import { PledgeComponent } from './components/pledge/pledge.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LabComponent,
    QuizComponent,
    ChecklistComponent,
    PledgeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
