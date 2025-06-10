VERSION=$1
if [ -z "${VERSION}" ]
then
	echo "Versione non fornita"
	exit 1
fi

bash package/script/build_artifact.sh ${VERSION} jsf
cp -r jsf-api-1.2_15-06/src/src/main/java/* govway-monitor-ui-jsf/src/
cp -r jsf-impl-1.2_15-06/src/src/main/java/* govway-monitor-ui-jsf/src/
cp -r jsf-facelets-1.1.15/src/src/main/java/* govway-monitor-ui-jsf/src/
unzip -q package/jsf/target/govway-monitor-ui-jsf-${VERSION}.jar -d govway-monitor-ui-jsf/classes

bash package/script/build_artifact.sh ${VERSION} api
cp -r richfaces-3.3.4.Final/src/framework/api/src/main/java/* govway-monitor-ui-api/src/
cp -r richfaces-3.3.4.Final/src/framework/impl/src/main/java/* govway-monitor-ui-api/src/
unzip -q package/api/target/govway-monitor-ui-api-${VERSION}.jar -d govway-monitor-ui-api/classes

bash package/script/build_artifact.sh ${VERSION} components
cp -r richfaces-3.3.4.Final/src/ui/*/src/main/java/* govway-monitor-ui-components/src/
unzip -q package/components/target/govway-monitor-ui-components-${VERSION}.jar -d govway-monitor-ui-components/classes
