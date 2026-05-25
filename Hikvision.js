import { exec } from "child_process";
import moment from "moment";
import { AttendanceResponse } from "./attendance.js";

class HikvisionAPI {
  constructor({ host, username, password }) {
    this.host = host;
    this.username = username;
    this.password = password;
  }

  digestRequest(url, username, password, method = "GET", body = null) {
    return new Promise((resolve, reject) => {
      let cmd = `curl  --digest -u "${username}:${password}" -X ${method}`;
      cmd += ` -H "Content-Type: application/json"`;
      if (body && method !== "GET") {
        cmd += ` -d '${JSON.stringify(body)}'`;
      }
      cmd += ` "${url}"`;
      exec(cmd, (error, stdout, stderr) => {
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

  async getUserInfo({userIds}) {
    const url = `${this.host}/ISAPI/AccessControl/UserInfo/Search`;
    if(userIds.length === 0) return [];
    const payload = {
      UserInfoSearchCond: {
        searchID: "1",
        searchResultPosition: 0,
        maxResults: userIds.length,
        employeeNoList: userIds.map((userId) => ({ employeeNo: userId })),
      },
    };
    const users = await this.digestRequest(url, this.username, this.password, "POST", payload);
    if(users?.UserInfoSearch?.numOfMatches > 0) {
      return  users.UserInfoSearch.UserInfo.map(user => ({
          userId: user.employeeNo,
          name: user?.name || 'Unknown',
        }));
      }
      return [];
  }
  
  async getAttendance({
    position = 0,
    major = 5,
    minor = 38,
    maxResults = 10,
  }) {
    const url = `${this.host}/ISAPI/AccessControl/AcsEvent?format=json`;
    const startTime = moment().utc(true).subtract(2, "hours").format("YYYY-MM-DDTHH:mm:ssZ");
    const endTime = moment()
      .utc(true)
      .add(15, "second")
      .format("YYYY-MM-DDTHH:mm:ssZ");
    const payload = {
      AcsEventCond: {
        searchID: "1",
        searchResultPosition: position,
        maxResults,
        major,
        minor,
        startTime,
        endTime,
      },
    };
    try {
      const response = await this.digestRequest(
        url,
        this.username,
        this.password,
        "POST",
        payload,
      );
      return new AttendanceResponse(response);
    } catch (_) {
      throw new Error(`Failed to fetch attendance data : ${_}`);
    }
  }
}

export default HikvisionAPI;
