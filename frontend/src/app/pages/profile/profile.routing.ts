import { Route } from '@angular/router';
import { ProfileResolver } from '../../core';
import { ProfileComponent } from './profile.component';
// import { ProfileArticlesComponent } from './profile-articles.component';
// import { ProfileFavoritesComponent } from './profile-favorites.component';

export default [
  {
    path: ':username',
    loadComponent: () => import('./profile.component').then(c => c.ProfileComponent),
    resolve: { profile: ProfileResolver }
  }
] as Route[]
