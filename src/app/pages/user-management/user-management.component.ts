import { Component } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BasicTableTwoComponent } from '../../shared/components/tables/basic-tables/basic-table-two/basic-table-two.component';

@Component({
  selector: 'app-user-management',
  imports: [PageBreadcrumbComponent, ComponentCardComponent, BasicTableTwoComponent],
  templateUrl: './user-management.component.html',
  styles: ``,
})
export class UserManagementComponent {}
