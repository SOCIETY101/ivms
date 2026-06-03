class User{
  constructor(data) {
    this.userId = data.employeeNo;
    this.name = data?.name || "Unknown";
  } 
}

class UserResponse{

constructor(response) {
    const info = response?.UserInfoSearch;
    if(!info){
      throw new Error('no matches users');
    }
    this.responseStatus = info.responseStatusStrg;
    this.numOfMatches = info.numOfMatches;
    this.totalMatches = info.totalMatches;
    this.users = info.numOfMatches > 0 ? (info.UserInfo || []).map(
      item => new User(item)
    ) : [];
  }
}


export default UserResponse;