import java.io.BufferedWriter;
import java.io.FileWriter;


public class Point {
	private int transactions;
	private int clients;
	private int timeoutTime;
	
	private long sumTimeBeforeInfo;
	private long sumTimeAfterInfo;
	private int transactionTimeouts;
	private int connectionTimeouts;
	private int correctConnections;
	
	public Point(int tx, int cli, int totime){
		this.transactions = tx;
		this.clients = cli;
		this.timeoutTime = totime;
	}
	public int getTransactions(){
		return this.transactions;
	}
	public int getClients(){
		return this.clients;
	}
	public int getTimeoutTime(){
		return this.timeoutTime;
	}
	public long getSumTimeBeforeInfo() {
		return sumTimeBeforeInfo;
	}
	public void setSumTimeBeforeInfo(long timeBeforeInfo) {
		this.sumTimeBeforeInfo = timeBeforeInfo;
	}
	public long getSumTimeAfterInfo() {
		return sumTimeAfterInfo;
	}
	public void setSumTimeAfterInfo(long timeAfterInfo) {
		this.sumTimeAfterInfo = timeAfterInfo;
	}
	public int getTransactionTimeouts() {
		return transactionTimeouts;
	}
	public void setTransactionTimeouts(int transactionTimeouts) {
		this.transactionTimeouts = transactionTimeouts;
	}
	public int getConnectionTimeouts() {
		return connectionTimeouts;
	}
	public void setConnectionTimeouts(int connectionTimeouts) {
		this.connectionTimeouts = connectionTimeouts;
	}
	public void setCorrectConnections(int correctConnections){
		this.correctConnections = correctConnections;
	}
	public void print(String filename){
		System.out.println("Transactions : " + transactions);
		System.out.println("Clients : " + clients);
		System.out.println("timeoutTime : " + timeoutTime);
		System.out.println("sumTimeBeforeInfo : " + sumTimeBeforeInfo);
		System.out.println("sumTimeAfterInfo : " + sumTimeAfterInfo);
		System.out.println("transactionTimeouts : " + transactionTimeouts);
		System.out.println("connectionTimeouts : " + connectionTimeouts);
		System.out.println("correctConnections : " + correctConnections);
		System.out.println("Mean time for measurements before the infoGET : " + (sumTimeBeforeInfo / clients));
		System.out.println("Mean time for measurements after the infoGET : " + (sumTimeAfterInfo / clients));
		
		String content = "";
		content += "Transactions:" + transactions + "\n" + "Clients:" + clients + "\n" + "timeoutTime:" + timeoutTime;
		content += "\n" + "sumTimeBeforeInfo:" + sumTimeBeforeInfo + "\n" + "sumTimeAfterInfo:" + sumTimeAfterInfo;
		content += "\n" + "transactionTimeouts:" + transactionTimeouts + "\n" + "connectionTimeouts:" + connectionTimeouts;
		content += "\n" + "correctConnections:" + correctConnections;
		content += "\n" + "Mean time for measurements before the infoGET:" + (sumTimeBeforeInfo / correctConnections);
		content += "\n" + "Mean time for measurements after the infoGET:" + (sumTimeAfterInfo / correctConnections);
		
		{
			  try{
			  // Create file
			  String[] result = filename.split("/");
			  FileWriter fstream = new FileWriter("statistics/" + result[1] + "_statistics.txt");
			  BufferedWriter out = new BufferedWriter(fstream);
			  out.write(content);
			  //Close the output stream
			  out.close();
			  }catch (Exception e){//Catch exception if any
			  System.err.println("Error: " + e.getMessage());
			  }
			  }
	}
}
