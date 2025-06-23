import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAcessAndRefreshToken= async(user_id)=>{
   try{
    const user = await User.findById(user_id);
    if (!user) {
      throw new ApiError(404, "User not found while generating tokens");
    }

    const accessToken = user.generateAccessToken();

    const refreshToken = user.generateRefreshToken();

    user.refreshToken=refreshToken
    await user.save({validateBeforeSave:false})
    
    return {accessToken,refreshToken};

   }catch(error)
   {
    console.error(" Error in generateAcessAndRefreshToken:", error);
    throw new ApiError(500,"Something went wrong while generating acess and refresh token")
   }
}
const registerUser = asyncHandler(async (req, res, next) => {
  const { fullName, email, username, password } = req.body;
  //console.log("request body", req.body);
 
  if([fullName, email, username, password ].some((field)=>field?.trim ()===""))
  {
    throw new ApiError(400,"All fields are required")
  }

  const existedUser=await User.findOne({
    $or:[{username},{email}]
  })

  if(existedUser)
  {
    throw new ApiError(409,"user with email or username already exists")
  }

  const avatarLocalPath = req.files?.["avatar"]?.[0]?.path;
  const coverImageLocalPath = req.files?.["coverImage"]?.[0]?.path;

  console.log("we get local path",avatarLocalPath);

  if(!avatarLocalPath)
  {
    throw new ApiError(400,"avatar not found");
  }

  const avatar=await uploadOnCloudinary(avatarLocalPath);
  const coverImage=await uploadOnCloudinary(coverImageLocalPath);


  if(!avatar)
  {
    throw new ApiError(400, "avatar not found");
  }

  
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
  
  
});


const loginUser = asyncHandler(async (req, res, next) => {
  //console.log(req.body);

  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email required");
  }

  const userExists = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!userExists) {
    throw new ApiError(400, "user not exist");
  }

  const ifCeredentialsRight = await userExists.isPasswordCorrect(password); // ✅ await here

  if (!ifCeredentialsRight) {
    throw new ApiError(400, "password is incorrect");
  }

  const {
    accessToken,
    refreshToken,
  } = 
    await generateAcessAndRefreshToken(userExists._id);

  const loggedInUser = await User.findById(userExists._id).select(
    "-password -refreshToken"
  ); 

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logout=asyncHandler(async(req,res,next)=>{
  await User.findOneAndUpdate(req.user?._id,{
    $set:{
      refreshToken:undefined
    }
  },
{
  new:true

})

  const options={
    httpOnly:true,
    secure:true
  }
  return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,{},"User Logout successfully"));
})



const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});
export {registerUser,loginUser,logout,refreshAccessToken}