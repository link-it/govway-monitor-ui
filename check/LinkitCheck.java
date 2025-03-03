/*
 * GovWay - A customizable API Gateway 
 * https://govway.org
 * 
 * Copyright (c) 2005-2024 Link.it srl (https://link.it). 
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

import java.io.*;

/**
 * LinkitCheck
 *
 * @author $Author$
 * @version $Rev$, $Date$
 * 
 */
public class LinkitCheck {

	public static final String[] GPL_CHECK = {"Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE",
			"Copyright (c) 2022-2024 Link.it srl (https://link.it)."};


	public static java.util.List<String> fileNonValidi = new java.util.ArrayList<>();
	public static java.util.List<String> dichiarazioneAssente = new java.util.ArrayList<>();

	// codice di uscita:
	// -1 invocazione non valida
	// 1 Errore generale
	// 2 file non validi per dichiarazione GPL
	public static void main(String[] args) {
		try {

			if(args.length < 1){
				System.out.println("Error usage: java LinkitCheck directory");
				System.exit(-1);
			}

			String dir = args[0];

			checkGPLDichiarazione(new File(dir));

			if(fileNonValidi.size()>0){
				for(int i=0; i<fileNonValidi.size(); i++){
					System.out.println("\nIl file "+fileNonValidi.get(i)+" non possiede una dichirazione di modifica LinkIT: \n"+dichiarazioneAssente.get(i)+"\n");
				}
				System.exit(2);
			}

		} catch(Exception ex) {
			System.err.println("Errore generale: " + ex);
			System.exit(1);
		}

	}

	@SuppressWarnings("unused")
	private static boolean printTODO = false;

	public static void checkGPLDichiarazione(File f) {
		try {
			if(f.isFile()){
				//System.out.println("FILE");
				if(f.getName().endsWith(".java") || 
						f.getName().endsWith(".html") ||
						f.getName().endsWith(".htm") ||
						f.getName().endsWith(".jsp") 
						){

					// Get Bytes Originali
					FileInputStream fis =new FileInputStream(f);
					ByteArrayOutputStream byteInputBuffer = new ByteArrayOutputStream();
					byte [] readB = new byte[8192];
					int readByte = 0;
					while((readByte = fis.read(readB))!= -1){
						byteInputBuffer.write(readB,0,readByte);
					}
					fis.close();

					String TODO = "METTERE QUA EVENTUALE NUOVO PATH";
					//if(!printTODO){		
					//	System.out.println("TODO: Eliminare controllo per NUOVO PATH");
					//	printTODO = true;		
					//}

					// check 
					// gestione eccezioni.
					if( !f.getAbsolutePath().contains("/richfaces-3.3.4.Final/src/cdk/maven-archetype-jsfwebapp/src/main/resources/archetype-resources/src/main/webapp/pages/index.jsp")
						&&
				            !f.getAbsolutePath().contains("/richfaces-3.3.4.Final/src/cdk/maven-archetype-jsfwebapp/src/main/resources/archetype-resources/src/main/webapp/index.jsp")
				                &&
				            !f.getAbsolutePath().contains("/richfaces-3.3.4.Final/src/cdk/maven-archetype-seam-app/src/main/resources/archetype-resources/web/src/main/webapp/index.html")
				                &&
				            !f.getAbsolutePath().contains("richfaces-3.3.4.Final/src/cdk/richfaces-facelets/target/classes/archetype-resources/src/main/webapp/index.jsp")
				                &&
				            !f.getAbsolutePath().contains("richfaces-3.3.4.Final/src/cdk/richfaces-facelets/src/main/resources/archetype-resources/src/main/webapp/index.jsp")
				                &&
                		            !f.getAbsolutePath().contains("richfaces-3.3.4.Final/src/cdk/maven-cdk-plugin/target/generated-sources")
						&&				                
                		            !f.getAbsolutePath().contains("richfaces-3.3.4.Final/src/cdk/maven-archetype-jsfwebapp/target/classes/")
						&&	                		            
				            !f.getAbsolutePath().contains("richfaces-3.3.4.Final/src/framework/impl/src/main/java/org/ajax4jsf/org/w3c/tidy") // Java HTML Tidy - JTidy
				                &&
   			                    !f.getAbsolutePath().contains("richfaces-3.3.4.Final/src/framework/impl/src/main/java/org/ajax4jsf/resource/image") // No copyright asserted on the source code of this class
				                &&
   			                    !f.getAbsolutePath().contains("richfaces-3.3.4.Final/src/framework/impl/src/main/java/org/ajax4jsf/xml/serializer") // xml.serializer
				                &&
   			                    !f.getAbsolutePath().contains("richfaces-3.3.4.Final/src/framework/impl/src/main/java/org/richfaces/json") // JSON.org
				                &&
   			                    !f.getAbsolutePath().contains("richfaces-3.3.4.Final/src/framework/impl/src/main/java/org/richfaces/renderkit/html/images") // html.images
				                &&
   			                    !f.getAbsolutePath().contains("richfaces-3.3.4.Final/src/framework/impl/src/main/resources/org/ajax4jsf/javascript/jsshell.html")
				                &&
   			                    !f.getAbsolutePath().contains("richfaces-3.3.4.Final/src/framework/impl/src/main/resources/org/ajax4jsf/xml/serializer/package.html")
				                &&
   			                    !f.getAbsolutePath().contains("richfaces-3.3.4.Final/src/framework/impl/src/main/java/org/ajax4jsf/application/package.html")
				                &&
   			                    !f.getAbsolutePath().contains("richfaces-3.3.4.Final/src/framework/impl/src/main/java/org/ajax4jsf/resource/package.html")
				                &&
   			                    !f.getAbsolutePath().contains("richfaces-3.3.4.Final/src/framework/impl/target/generated-sources")
				                &&
   			                    !f.getAbsolutePath().contains("richfaces-3.3.4.Final/src/framework/impl/target/classes")
				                &&
   			                    !f.getAbsolutePath().contains("richfaces-3.3.4.Final/src/framework/jsf-test/src")
				                &&
   			                    !f.getAbsolutePath().contains("richfaces-3.3.4.Final/src/framework/test/src/main/resources/META-INF/resources/w3c/MarkUp/DTD/examples")
   			                    
							){

						for(int i=0; i<GPL_CHECK.length; i++){

							String checkGPLString = GPL_CHECK[i];

							int indexFound = byteInputBuffer.toString().indexOf(checkGPLString);
							if(indexFound==-1){

								fileNonValidi.add(f.getAbsolutePath());
								dichiarazioneAssente.add(checkGPLString);		
								break;
							}

						}
					}
				}   
			}else{
				//System.out.println("DIR");
				File [] fChilds = f.listFiles();
				if(fChilds!=null){
					for (int i = 0; i < fChilds.length; i++) {
						checkGPLDichiarazione(fChilds[i]);
					}
				}
			}

		}
		catch(Exception ex) {
			System.out.println("Errore writeGPLDichiarazione: " + ex);
			return;
		}

	}
}
