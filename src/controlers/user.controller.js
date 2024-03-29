import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js";
import fs from "fs"

const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validation - not empty
    //check if user aleardy exist: username and email
    //check for images, check for avatar
    //upload them to cloudinary, check avatar 
    //create user object - create entry in db
    //remove password and refresh token field from response`
    //check for user creation
    //return response
    const { fullname, email, username, password } = req.body

    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new apiError(400, "All fields are required")
    }
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        if (req.files.avatar !== undefined) {
            const deleteAvatarFile = req.files?.avatar[0]?.path
            fs.unlinkSync(deleteAvatarFile)
        }
        throw new apiError(409, "User with email or username already existed")
    }
    // console.log(req.files.avatar[0])

    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length <= 0) {
        throw new apiError(409, "Avatar file path is not available")
    }


    if (req.files.avatar == undefined) {
        throw new apiError(400, "Avatar file is undefined")
    }
    // console.log(avatarLocalPath)
    // const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    const avatarLocalPath = req.files?.avatar[0]?.path
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {
        throw new apiError(400, "Avatar file is required")
    }
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        // coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshTokken"
    )
    if (!createdUser) {
        throw new apiError(500, "Something went wrong while registering user")
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User register successfully")
    )

})

export { registerUser }