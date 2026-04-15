import { Component } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BasicTableOneComponent } from '../../shared/components/tables/basic-tables/basic-table-one/basic-table-one.component';

@Component({
  selector: 'app-user-management',
  imports: [PageBreadcrumbComponent, ComponentCardComponent, BasicTableOneComponent],
  templateUrl: './user-management.component.html',
  styles: ``,
})
export class UserManagementComponent {}
