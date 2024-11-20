/**
 * License Agreement.
 *
 * YUI Compressor Maven Mojo
 *
 * Copyright (C) 2007 Alchim31 Team
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License version 2.1 as published by the Free Software Foundation.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301  USA
 */
/*
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE
 * 
 * Copyright (c) 2022-2024 Link.it srl (https://link.it). 
 */
package net.sf.alchim.mojo.yuicompressor;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Set;

import org.codehaus.plexus.util.DirectoryScanner;
import org.codehaus.plexus.util.IOUtil;
import org.codehaus.plexus.util.StringUtils;
import org.sonatype.plexus.build.incremental.BuildContext;

public class Aggregation {
    public File inputDir;
    public File output;
    public String[] includes;
    public String[] excludes;
    public boolean removeIncluded = false;
    public boolean insertNewLine = false;
    public boolean insertFileHeader = false;
    public boolean fixLastSemicolon = false;
    public boolean autoExcludeWildcards = false;

    public List<File> run(Collection<File> previouslyIncludedFiles, BuildContext buildContext) throws Exception {
        return this.run(previouslyIncludedFiles, buildContext, null);
    }

    public List<File> run(Collection<File> previouslyIncludedFiles, BuildContext buildContext, Set<String> incrementalFiles) throws Exception {
        defineInputDir();
        
//        System.out.println("Aggregation InputDir:" + inputDir.getCanonicalPath());
//        System.out.println("Aggregation Output:" + output.getCanonicalPath());
//        System.out.println("Aggregation includes:" + StringUtils.join(includes, ","));
//        System.out.println("Aggregation excludes:" + StringUtils.join(excludes, ","));
//        System.out.println("Aggregation removeIncluded:" + removeIncluded);
//        System.out.println("Aggregation insertNewLine:" + insertNewLine);
//        System.out.println("Aggregation insertFileHeader:" + insertFileHeader);
//        System.out.println("Aggregation fixLastSemicolon:" + fixLastSemicolon);
//        System.out.println("Aggregation autoExcludeWildcards:" + autoExcludeWildcards);

        List<File> files;
        if (autoExcludeWildcards) {
            files = getIncludedFiles(previouslyIncludedFiles, buildContext, incrementalFiles);
        } else {
            files = getIncludedFiles(null, buildContext, incrementalFiles);
        }

        if (files.size() != 0) {
            output = output.getCanonicalFile();
            output.getParentFile().mkdirs();
            OutputStream out = buildContext.newFileOutputStream(output);
            try {
                for (File file : files) {
                	// System.out.println("Aggregation Aggiungo File:" + file.getCanonicalPath());
                    if (file.getCanonicalPath().equals(output.getCanonicalPath())) {
                        continue;
                    }
                    FileInputStream in = new FileInputStream(file);
                    try {
                        if (insertFileHeader) {
                            out.write(createFileHeader(file).getBytes());
                        }
                        IOUtil.copy(in, out);
                        if (fixLastSemicolon) {
                            out.write(';');
                        }
                        if (insertNewLine) {
                            out.write('\n');
                        }
                    } finally {
                        IOUtil.close(in);
                        in = null;
                    }
                    if (removeIncluded) {
                        file.delete();
                        buildContext.refresh(file);
                    }
                }
            } finally {
                IOUtil.close(out);
                out = null;
            }
        }
        
        /*try (FileInputStream fis = new FileInputStream(output); ByteArrayOutputStream baos = new ByteArrayOutputStream()){
        	IOUtil.copy(fis, baos);
        	
        	System.out.println("Aggregation RISULTATO START --------");
        	
        	System.out.println(baos.toString());
        	
        	System.out.println("Aggregation RISULTATO END --------");
        }*/
        
        
        return files;
    }

    private String createFileHeader(File file) {
        StringBuilder header = new StringBuilder();
        header.append("/*");
        header.append(file.getName());
        header.append("*/");

        if (insertNewLine) {
            header.append('\n');
        }

//        try {
//			System.out.println("Aggregation Header File:" + file.getCanonicalPath() + "--> " + header.toString());
//		} catch (IOException e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//		}
        return header.toString();
    }

    private void defineInputDir() throws Exception {
        if (inputDir == null) {
            inputDir = output.getParentFile();
        }
        inputDir = inputDir.getCanonicalFile();
        if (!inputDir.isDirectory()) {
            throw new IllegalStateException("input directory not found: " + inputDir);
        }
    }

    private List<File> getIncludedFiles(Collection<File> previouslyIncludedFiles, BuildContext buildContext, Set<String> incrementalFiles) throws Exception {
        List<File> filesToAggregate = new ArrayList<>();
        if (includes != null) {
            for (String include : includes) {
                addInto(include, filesToAggregate, previouslyIncludedFiles);
            }
        }

        //If build is incremental with no delta, then don't include for aggregation
        if (buildContext.isIncremental()) {

            if (incrementalFiles != null) {
                boolean aggregateMustBeUpdated = false;
                for (File file : filesToAggregate) {
                    if (incrementalFiles.contains(file.getAbsolutePath())) {
                        aggregateMustBeUpdated = true;
                        break;
                    }
                }

                if (aggregateMustBeUpdated) {
                    return filesToAggregate;
                }
            }
            return new ArrayList<File>();
        } else {
            return filesToAggregate;
        }

    }

    private void addInto(String include, List<File> includedFiles, Collection<File> previouslyIncludedFiles) throws Exception {
        if (include.indexOf('*') > -1) {
        	//System.out.println("Aggregation Aggiungo " + include);
            DirectoryScanner scanner = newScanner();
            scanner.setIncludes(new String[]{include});
            scanner.scan();
            String[] rpaths = scanner.getIncludedFiles();
            Arrays.sort(rpaths);
            //System.out.println("Aggregation Trovati:" + StringUtils.join(rpaths, ","));
            for (String rpath : rpaths) {
                File file = new File(scanner.getBasedir(), rpath);
                //System.out.println("Aggregation Aggiungo File *:" + file.getCanonicalPath());
                if (!includedFiles.contains(file) && (previouslyIncludedFiles == null || !previouslyIncludedFiles.contains(file))) {
                	//System.out.println("Aggregation Aggiungo File *:" + file.getCanonicalPath() + " OK");
                    includedFiles.add(file);
                }
            }
        } else {
            File file = new File(include);
            if (!file.isAbsolute()) {
                file = new File(inputDir, include);
            }
            if (!includedFiles.contains(file)) {
                includedFiles.add(file);
            }
        }
    }

    private DirectoryScanner newScanner() throws Exception {
        DirectoryScanner scanner = new DirectoryScanner();
        scanner.setBasedir(inputDir);
        if ((excludes != null) && (excludes.length != 0)) {
            scanner.setExcludes(excludes);
        }
        scanner.addDefaultExcludes();
        return scanner;
    }
}
