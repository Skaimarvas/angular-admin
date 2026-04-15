import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { paginationPageSizeOptions } from "../../../../libs/pagination";

@Component({
    selector: "app-pagination",
    standalone: true,
    imports: [FormsModule],
    templateUrl: "./pagination.html",
    styles: ``
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() itemsPerPage = 10;
  @Input() pageSizeOptions: number[] = paginationPageSizeOptions;

  @Output() pageChange = new EventEmitter<number>();
  @Output() itemsPerPageChange = new EventEmitter<number>();

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  setItemsPerPage(size: number) {
    this.itemsPerPageChange.emit(Number(size));
  }
}
