//high order function
//const asyncHandler=()=>{()=>{}}

//using try catch
/*
const asyncHandler = (requestHandler) => {
  async (req,res,next) => {
    try{
      await requestHandler(req,res,next)
    }catch(error){
      res.status(err.code||500).json({
        sucesss:false,
        message:err.message
      })
    }

  };
};
*/
const asyncHandler = (requestHandler) => { 
  return(req,res,next) => {
    Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
  };
};

export {asyncHandler}