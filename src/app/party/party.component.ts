import {
  Component,
  OnInit,
  Input,
  Inject,
  ViewChild,
  EventEmitter,
} from "@angular/core";
import { DataService } from "../data.service";
import { ErrorStateMatcher } from "@angular/material/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTableDataSource } from "@angular/material/table";
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  FormGroup,
  FormBuilder,
  Validators,
} from "@angular/forms";
import { Party } from "../party";
import { MatDialog, MAT_DIALOG_DATA } from "@angular/material/dialog";

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || isSubmitted));
  }
}

@Component({
  selector: "app-party",
  templateUrl: "./party.component.html",
  styleUrls: ["./party.component.scss"],
})
export class PartyComponent implements OnInit {
  public editData: any;
  displayedColumns: string[] = ["url", "_id"];
  @Input("input") dataSource: any;

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  constructor(
    private data: DataService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar
  ) {}

  ngOnInit() {}

  //Delete a representative
  onDelete(id: string) {
    const partyList = JSON.parse(localStorage["party_list"]);
    const partyListNew = partyList.filter((party) => party["_id"] != id);
    localStorage["party_list"] = JSON.stringify(partyListNew);
    this.dataSource = new MatTableDataSource(partyListNew);
    this.data.deleteParty(id).subscribe(
      (data) => {
        this.snackBar.open("Deleted", "close", {
          duration: 2000,
        });
      },
      (err) => {
        this.snackBar.open("Unable to delete", "close", {
          duration: 2000,
        });
        localStorage["party_list"] = JSON.stringify(partyList);
        this.dataSource = new MatTableDataSource(partyList);
      }
    );
  }

  openDialog() {}

  //Store editted representative info and update database
  onEdit(id: string) {
    const partyList = JSON.parse(localStorage["party_list"]);
    const selectedParty = partyList.filter((party) => party["_id"] === id);
    let ref = this.dialog.open(PartyEditForm, {
      data: selectedParty[0],
    });
    let sub = ref.componentInstance.saved.subscribe((data) => {
      if (data) {
        this.snackBar.open("Update successful", "close", {
          duration: 2000,
        });
        this.getDataSource();
        ref.close();
      } else {
        this.snackBar.open("Unable to update", "close", {
          duration: 2000,
        });
        this.getDataSource();
        ref.close();
      }
    });
  }

  getDataSource() {
    return this.data.getParties().subscribe((data) => {
      localStorage["party_list"] = JSON.stringify(data);
      this.dataSource = new MatTableDataSource(data as {}[]);
    });
  }
}

@Component({
  selector: "party-edit-form",
  templateUrl: "./party.edit.html",
  styleUrls: ["./party.component.scss"],
})
export class PartyEditForm implements OnInit {
  public saved = new EventEmitter<boolean>();
  partyModel = new Party("", -1, "");
  public test = "adawda";
  //Validation and error checking
  matcher = new MyErrorStateMatcher();
  modalFormGroup: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public party: any,
    private _formBuilder: FormBuilder,
    private data: DataService
  ) {}
  ngOnInit() {
    this.modalFormGroup = this._formBuilder.group({
      nameCtrl: [this.party.name, Validators.required],
      numberCtrl: [this.party.number, Validators.required],
      urlCtrl: [this.party.url, Validators.required],
    });
  }

  onSave(f: any) {
    this.partyModel.name =
      f.value.nameCtrl == "" ? this.party.name : f.value.nameCtrl;
    this.partyModel.number =
      f.value.numberCtrl == "" ? this.party.number : f.value.numberCtrl;
    this.partyModel.url =
      f.value.urlCtrl == "" ? this.party.url : f.value.urlCtrl;
    this.data.updateParty(this.party._id, this.partyModel).subscribe((data) =>
      this.data.getParties().subscribe(
        (data) => this.saved.emit(true),
        (err) => this.saved.emit(false)
      )
    );
  }
}
