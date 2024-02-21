import { Component, OnInit, Input } from '@angular/core';
import { Events } from 'src/app/events/events';
import { CheckoutActionType, StatusTypes } from 'src/app/models/db-models/inspection-model';

@Component({
  selector: 'app-checkout-action-list',
  templateUrl: './checkout-action-list.component.html',
  styleUrls: ['./checkout-action-list.component.scss'],
})
export class CheckoutActionListComponent implements OnInit {
  @Input() inspectionObj: any;
  objStatusType = StatusTypes;
  actionTypeEnum = CheckoutActionType;

  constructor(private events: Events) {
  }

  ngOnInit() { }

  checkoutActionEvent(actionType) {
    let data = {
      inspectionObj:this.inspectionObj,
      actionType:actionType
    }
    this.events.publish("checkoutActionEvent", data);
  }
}
