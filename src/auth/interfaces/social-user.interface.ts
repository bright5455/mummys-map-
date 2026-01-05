export interface GoogleUser {
  googleId: string;
  email: string;
  firstName: string|undefined;
  lastName: string|undefined ;
  picture: string|undefined ;
  accessToken?: string;
}

export interface FacebookUser {
  facebookId: string;
  email: string;
  firstName: string|undefined;
  lastName: string|undefined ;
  picture: string|undefined ;
  accessToken?: string;
}

export interface AppleUser {
  appleId: string;
  email: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
}