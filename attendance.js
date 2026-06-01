class AttendanceRecord {
  constructor(data) {
    this.recordedAt = data.time;
    this.userId = data.employeeNoString;
    this.status = data.attendanceStatus == undefined ? null : data.attendanceStatus;
  } 
}

class AttendanceResponse {
  constructor(response) {
    const acs = response.AcsEvent;
    if(!acs){
      throw new Error(`Failed : ${response.statusString}`);
    }
    this.searchID = acs.searchID;
    this.responseStatus = acs.responseStatusStrg;
    this.numOfMatches = acs.numOfMatches;
    this.totalMatches = acs.totalMatches;
    this.records = acs.numOfMatches > 0 ? (acs.InfoList || []).map(
      item => new AttendanceRecord(item)
    ) : [];
  }
}

export {
  AttendanceResponse,
  AttendanceRecord
};