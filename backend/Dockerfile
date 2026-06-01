#Step one: Use Java 23 runtime as base imagine
FROM openjdk:17-jdk-slim

#Step two: Set working directory inside container
WORKDIR /app

#Step three: Copy compiled jar file from the directory into container
COPY target/*.jar app.jar

#Step four: Expose port that the app runs on
EXPOSE 8080

#Step five: Command to execute the application
ENTRYPOINT ["java", "-jar", "app.jar"]