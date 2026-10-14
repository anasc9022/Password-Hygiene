import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LabComponent } from './components/lab/lab.component';
import { ChecklistComponent } from './components/checklist/checklist.component';
import { QuizComponent } from './components/quiz/quiz.component';
import { PledgeComponent } from './components/pledge/pledge.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'lab', component: LabComponent },
  { path: 'quiz', component: QuizComponent },
  { path: 'checklist', component: ChecklistComponent },
  { path: 'pledge', component: PledgeComponent },
  { path: '**', redirectTo: '' },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
