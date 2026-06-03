import { exec } from "child_process";
import moment from "moment";
import { AttendanceResponse } from "./attendance.js";

class HikvisionAPI {
  constructor({ host, username, password,device }) {
    this.host = host;
    this.username = username;
    this.password = password;
    this.major = 5;
    this.minor = 38;
    this.maxResults = 10;
    this.device = device;
    this.startTime = moment().utc(true).subtract(this.device.includes('5') ? 3615 : 15,'seconds').format("YYYY-MM-DDTHH:mm:ssZ");
    this.endTime = moment()
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

  async getUserInfo({ userIds }) {
    const url = `${this.host}/ISAPI/AccessControl/UserInfo/Search`;
    if (userIds.length === 0) return [];
    const payload = {
      UserInfoSearchCond: {
        searchID: "1",
        searchResultPosition: 0,
        maxResults: userIds.length,
        employeeNoList: userIds.map((userId) => ({ employeeNo: userId })),
      },
    };
    const users = await this.digestRequest(
      url,
      this.username,
      this.password,
      "POST",
      payload,
    );
    if (users?.UserInfoSearch?.numOfMatches > 0) {
      return users.UserInfoSearch.UserInfo.map((user) => ({
        userId: user.employeeNo,
        name: user?.name || "Unknown",
      }));
    }
    return [];
  }

  async getUsersRecords({ position = 0,star }) {
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
          const nextBatch = await this.getUsersRecords({nextPosition});
          nextPosition += nextPosition + nextBatch.numOfMatches;
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
