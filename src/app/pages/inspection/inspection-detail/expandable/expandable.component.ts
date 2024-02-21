import { Component, EventEmitter, Input, Output } from '@angular/core';
import { InspectionImage } from 'src/app/models/db-models/image-model';

@Component({
  selector: 'app-expandable',
  templateUrl: './expandable.component.html',
  styleUrls: ['./expandable.component.scss'],
})
export class ExpandableComponent {

  @Input()
  name: string;

  @Input()
  isMandatory: string;

  @Input()
  description: string;

  @Input()
  arrImage: InspectionImage[];

  @Input()
  arrTable: string[];

  @Input()
  arrColumn: string[] = [];

  @Input()
  arrRow: number[];

  @Output()
  change: EventEmitter<string> = new EventEmitter<string>();

  public isMenuOpen = false;
  tblWidth: number
  constructor() {
    this.tblWidth = screen.width / this.arrColumn.length;
    window.addEventListener("orientationchange", () => {
      this.tblWidth = screen.width / this.arrColumn.length;
    });
  }

  public toggleAccordion(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  checkIsAnswer(description, arrImage, arrTable) {
    if (description.trim() == '' && arrImage.length == 0 && (arrTable.length == 0 || arrTable.every(x => x === null || x === ''))) {
      return true;
    }
    return false;
  }
}
