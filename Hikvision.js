import { exec } from "child_process";
import moment from "moment";
import { AttendanceResponse } from "./attendance.js";
import UserResponse from "./user.js";

class HikvisionAPI {
  constructor({ host, username, password,device}) {
    this.host = host;
    this.username = username;
    this.password = password;
    this.major = 5;
    this.minor = 38;
    this.maxResults = 10;
    this.device = device;
    this.startTime =  moment().utc(true).subtract(this.device.includes('5') ? 3615 : 15,'seconds').format("YYYY-MM-DDTHH:mm:ssZ");
    this.endTime =  moment()
      .utc(true)
      .subtract(this.device.includes('5') ? 3601:1,'seconds')
      .format("YYYY-MM-DDTHH:mm:ssZ");
  }

  digestRequest(url, username, password, method = "GET", body = null) {
    return new Promise((resolve, reject) => {
      let cmd = `curl  --digest -u "admin:${password}" -X ${method}`;
      cmd += ` -H "Content-Type: application/json"`;
      if (body && method !== "GET") {
        cmd += ` -d "${JSON.stringify(body).replace(/"/g, '\\"')}"`
      }
      cmd += ` "${url}"`;
      exec(cmd,{windowsHide:true}, (error, stdout, stderr) => {
        if (error) {
          return reject(error);
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          resolve(stdout);
        }
      });
    });
  }

  async getusersDetails({position = 0,ids}){
    const host  = `${this.host}/ISAPI/AccessControl/UserInfo/Search`;
    const payload = {
      UserInfoSearchCond: {
        searchID: "1",
        searchResultPosition: position,
        maxResults: 10,
        employeeNoList: ids.map((userId) => ({ employeeNo: userId })),
      },
    };

   try {
      const response = await this.digestRequest(
        host,
        this.username,
        this.password,
        "POST",
        payload,
      );

      return new UserResponse(response);
    } catch (e) {
       throw new Error(e?.message);
    }

  }

  async getUserInfo({ userIds,position= 0 }) {

    try{

      if (userIds.length === 0) return [];
      const userResponse =  await this.getusersDetails({position:0,ids:userIds});

      if (userResponse.totalMatches > 10) {
        var nextPosition = position + userResponse.numOfMatches;
        while (nextPosition < userResponse.totalMatches) {
          let nextBatch = await this.getusersDetails({position:nextPosition,ids:userIds});
          nextPosition += nextBatch.numOfMatches;
          userResponse.users.push(...nextBatch.users);
        }
      }
      return userResponse.users;
    }catch(_){
      console.log(_.message);
      return [];
    }
  }

  async getUsersRecords({ position = 0 }) {
    const host = `${this.host}/ISAPI/AccessControl/AcsEvent?format=json`;
    const payload = {
      AcsEventCond: {
        searchID: "1",
        searchResultPosition: position,
        maxResults: this.maxResults,
        major: this.major,
        minor: this.minor,
        startTime:this.startTime,
        endTime:this.endTime
      },
    };
    try {
      const response = await this.digestRequest(
        host,
        this.username,
        this.password,
        "POST",
        payload,
      );
      return new AttendanceResponse(response,this.device);  
    } catch (e) {
      throw new Error(e?.message);
    }
  }

  async getAttendance({position = 0}) {
    try {

      const attendanceResponse = await this.getUsersRecords({position});
      if (attendanceResponse.totalMatches > 10) {
        var nextPosition = position + attendanceResponse.numOfMatches;
        while (nextPosition < attendanceResponse.totalMatches) {
          let nextBatch = await this.getUsersRecords({position:nextPosition});
          nextPosition += nextBatch.numOfMatches;
          attendanceResponse.records.push(...nextBatch.records);
        }
      }
      return attendanceResponse;
    } catch (_) {
      throw new Error(_);
    }
  }
}

export default HikvisionAPI;
