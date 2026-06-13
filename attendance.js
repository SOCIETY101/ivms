class AttendanceRecord {
  constructor(data) {
    this.recordedAt = data.time;
    this.userId = data.employeeNoString;
    this.status = data.attendanceStatus == undefined ? null : data.attendanceStatus;
  } 
}

class AttendanceResponse {
  constructor(response,device) {
    const acs = response?.AcsEvent;
    if(!acs){
      throw new Error(`${response?.statusString ?? 'no matches'}`);
    }
    this.searchID = acs.searchID;
    this.responseStatus = acs.responseStatusStrg;
    this.numOfMatches = acs.numOfMatches;
    this.totalMatches = acs.totalMatches;
    this.device = device;
    this.records = acs.numOfMatches > 0 ? (acs.InfoList || []).map(
      item => new AttendanceRecord(item)
    ) : [];
  }

  recordsByUserId(room, users) {
    return this.records.map(record => ({
      userId: record.userId,
          name: users.find((user) => user.userId === record.userId)?.name || "Unknown",
          status: record.status == "undefined" ? "checkIn" : record.status,
          recordedAt: record.recordedAt,
          device: room
    }));
  } 
}
export  default AttendanceResponse;
