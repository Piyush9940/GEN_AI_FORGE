import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();


const connectDB = async () => {
    try {
        // HACKATHON FAILSAFE: If .env fails, it will automatically use the local database!
        // Replace the fallback string with your MongoDB Atlas URL if you have one.
        const uri = "mongodb+srv://piyushm232103_db_user:EkwREiFusWE58bjm@cluster0.ezm2j7e.mongodb.net/?appName=Cluster0"  ;

        if (!uri) {
             console.error("❌ Database URI is missing entirely!");
             process.exit(1);
        }

        // Attempt to connect to the database (Mongoose 6+ doesn't need the extra options)
        const conn = await mongoose.connect(uri);

        console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1); 
    }
};

export default connectDB;