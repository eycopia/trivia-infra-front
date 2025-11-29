import { Routes } from '@angular/router';
import { LoginComponent } from './login.component';
import { GamePlayerComponent } from './game-player.component';
import { AdminLoginComponent } from './admin-login.component';
import { HostScreenComponent } from './host-screen.component';
import { GameSelectionComponent } from './game-selection.component';
import { AdminGamesComponent } from './admin-games.component';
import { AdminCreateGameComponent } from './admin-create-game.component';
import { AdminQuestionsComponent } from './admin-questions.component';
import { AdminWinnersComponent } from './admin-winners.component';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
    { path: '', component: LoginComponent },
    { path: 'games', component: GameSelectionComponent },
    { path: 'game/:gameId', component: GamePlayerComponent },
    { path: 'admin/login', component: AdminLoginComponent },
    {
        path: 'admin/games',
        component: AdminGamesComponent,
        canActivate: [AdminGuard]
    },
    {
        path: 'admin/create-game',
        component: AdminCreateGameComponent,
        canActivate: [AdminGuard]
    },
    {
        path: 'admin/host/:gameId',
        component: HostScreenComponent,
        canActivate: [AdminGuard]
    },
    {
        path: 'admin/game/:id/questions',
        component: AdminQuestionsComponent,
        canActivate: [AdminGuard]
    },
    {
        path: 'admin/winners',
        component: AdminWinnersComponent,
        canActivate: [AdminGuard]
    },
    { path: '**', redirectTo: '' }
];
